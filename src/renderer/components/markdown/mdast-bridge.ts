import { remarkCtx, schemaCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import type { Node } from '@milkdown/kit/prose/model';
import {
  ParserState,
  SerializerState,
  type MarkdownNode,
} from '@milkdown/kit/transformer';

import {
  isEmptyParagraphOnly,
  mdAstRootSchema,
  type MdAstBlockNode,
  type MdAstHeading,
  type MdAstListItem,
  type MdAstPhrasingNode,
  type MdAstRoot,
  type MdAstTable,
  type MdAstTableCell,
  type MdAstTableRow,
} from '@elek-io/core';

/**
 * Thrown when the editor's document cannot be turned into a tree Core accepts.
 * Callers surface it as a field error instead of silently losing content.
 */
export class MdastBridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MdastBridgeError';
  }
}

/**
 * Turns a Core mdast tree into a ProseMirror document for the editor.
 *
 * Milkdown's parsing pipeline is markdown string -> remark -> mdast ->
 * ProseMirror. Core already stores mdast, so this enters the pipeline after
 * remark's parse: running the editor's own remark processor over the tree
 * applies the same transformer plugins (list numbering, line break handling)
 * the node parsers expect from a string parse.
 */
export function mdastToDoc(ctx: Ctx, root: MdAstRoot): Node {
  const schema = ctx.get(schemaCtx);
  const remark = ctx.get(remarkCtx);
  // runSync types its result as unified's plain Node, structurally the same
  // mdast tree Milkdown's MarkdownNode describes
  const tree = remark.runSync(structuredClone(root)) as MarkdownNode;
  return new ParserState(schema).next(tree).toDoc();
}

/**
 * Turns the editor's ProseMirror document into a Core mdast tree, or null when
 * the document is effectively empty (Core stores empty content as null).
 */
export function docToMdast(ctx: Ctx, doc: Node): MdAstRoot | null {
  const schema = ctx.get(schemaCtx);
  const serialized = new SerializerState(schema).run(doc).build();
  const blockChildren = blockNodes(children(serialized));
  // Checked before the parse: Core's root schema itself rejects the empty
  // editor state, which must become null instead of a validation error
  if (
    blockChildren.length === 0 ||
    isEmptyParagraphOnly({ children: blockChildren })
  ) {
    return null;
  }
  return mdAstRootSchema.parse({ type: 'root', children: blockChildren });
}

// The serializer emits loose mdast (unist) nodes whose per-type fields are
// untyped. This local shape makes reading them explicit; the accessors below
// fill the fields Core requires but remark leaves optional. The final
// mdAstRootSchema.parse in docToMdast guarantees only Core-valid trees leave
// this module and strips anything extra (like position data).
interface LooseNode {
  type: string;
  children?: LooseNode[];
  [key: string]: unknown;
}

function children(node: MarkdownNode | LooseNode): LooseNode[] {
  return node.children ?? [];
}

function text(node: LooseNode, key: string): string {
  const value = node[key];
  return typeof value === 'string' ? value : '';
}

function textOrNull(node: LooseNode, key: string): string | null {
  const value = node[key];
  return typeof value === 'string' ? value : null;
}

function booleanOrNull(node: LooseNode, key: string): boolean | null {
  const value = node[key];
  return typeof value === 'boolean' ? value : null;
}

function headingDepth(node: LooseNode): MdAstHeading['depth'] {
  const depth = node['depth'];
  if (
    depth === 1 ||
    depth === 2 ||
    depth === 3 ||
    depth === 4 ||
    depth === 5 ||
    depth === 6
  ) {
    return depth;
  }
  throw new MdastBridgeError(
    `Heading depth must be between 1 and 6, got "${String(depth)}"`
  );
}

function tableAlign(node: LooseNode): MdAstTable['align'] {
  const align = node['align'];
  if (!Array.isArray(align)) {
    return [];
  }
  return align.map((entry) =>
    entry === 'left' || entry === 'right' || entry === 'center' ? entry : null
  );
}

function blockNodes(nodes: LooseNode[]): MdAstBlockNode[] {
  return nodes.map((node) => blockNode(node));
}

function blockNode(node: LooseNode): MdAstBlockNode {
  switch (node.type) {
    case 'paragraph':
      return { type: 'paragraph', children: phrasingNodes(children(node)) };
    case 'heading':
      return {
        type: 'heading',
        depth: headingDepth(node),
        children: phrasingNodes(children(node)),
      };
    case 'blockquote':
      return { type: 'blockquote', children: blockNodes(children(node)) };
    case 'list':
      return {
        type: 'list',
        ordered: node['ordered'] === true,
        start: typeof node['start'] === 'number' ? node['start'] : null,
        spread: booleanOrNull(node, 'spread'),
        children: children(node).map((item) => listItem(item)),
      };
    case 'code':
      return {
        type: 'code',
        lang: textOrNull(node, 'lang'),
        meta: textOrNull(node, 'meta'),
        value: text(node, 'value'),
      };
    case 'thematicBreak':
      return { type: 'thematicBreak' };
    case 'html':
      return { type: 'html', value: text(node, 'value') };
    case 'table':
      return {
        type: 'table',
        align: tableAlign(node),
        children: children(node).map((row) => tableRow(row)),
      };
    case 'footnoteDefinition':
      return {
        type: 'footnoteDefinition',
        identifier: text(node, 'identifier'),
        label: textOrNull(node, 'label'),
        children: blockNodes(children(node)),
      };
    default:
      throw new MdastBridgeError(
        `Unsupported block node type "${node.type}" while serializing the editor content`
      );
  }
}

function listItem(node: LooseNode): MdAstListItem {
  if (node.type !== 'listItem') {
    throw new MdastBridgeError(
      `Expected a listItem inside a list, got "${node.type}"`
    );
  }
  return {
    type: 'listItem',
    spread: booleanOrNull(node, 'spread'),
    checked: booleanOrNull(node, 'checked'),
    children: blockNodes(children(node)),
  };
}

function tableRow(node: LooseNode): MdAstTableRow {
  if (node.type !== 'tableRow') {
    throw new MdastBridgeError(
      `Expected a tableRow inside a table, got "${node.type}"`
    );
  }
  return {
    type: 'tableRow',
    children: children(node).map((cell) => tableCell(cell)),
  };
}

function tableCell(node: LooseNode): MdAstTableCell {
  if (node.type !== 'tableCell') {
    throw new MdastBridgeError(
      `Expected a tableCell inside a tableRow, got "${node.type}"`
    );
  }
  return { type: 'tableCell', children: phrasingNodes(children(node)) };
}

function phrasingNodes(nodes: LooseNode[]): MdAstPhrasingNode[] {
  return nodes.map((node) => phrasingNode(node));
}

function phrasingNode(node: LooseNode): MdAstPhrasingNode {
  switch (node.type) {
    case 'text':
      return { type: 'text', value: text(node, 'value') };
    case 'inlineCode':
      return { type: 'inlineCode', value: text(node, 'value') };
    case 'break':
      return { type: 'break' };
    case 'html':
      return { type: 'html', value: text(node, 'value') };
    case 'image':
      return {
        type: 'image',
        url: text(node, 'url'),
        title: textOrNull(node, 'title'),
        alt: text(node, 'alt'),
      };
    case 'footnoteReference':
      return {
        type: 'footnoteReference',
        identifier: text(node, 'identifier'),
        label: textOrNull(node, 'label'),
      };
    case 'assetReference':
      return {
        type: 'assetReference',
        assetId: text(node, 'assetId'),
        alt: text(node, 'alt'),
        title: textOrNull(node, 'title'),
      };
    case 'entryReference':
      return {
        type: 'entryReference',
        collectionId: text(node, 'collectionId'),
        entryId: text(node, 'entryId'),
        children: phrasingNodes(children(node)),
      };
    case 'emphasis':
      return { type: 'emphasis', children: phrasingNodes(children(node)) };
    case 'strong':
      return { type: 'strong', children: phrasingNodes(children(node)) };
    case 'delete':
      return { type: 'delete', children: phrasingNodes(children(node)) };
    case 'link':
      return {
        type: 'link',
        url: text(node, 'url'),
        title: textOrNull(node, 'title'),
        children: phrasingNodes(children(node)),
      };
    default:
      throw new MdastBridgeError(
        `Unsupported phrasing node type "${node.type}" while serializing the editor content`
      );
  }
}
