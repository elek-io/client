// @see https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forward_and_create_ref/#option-3---call-signature
interface ForwardRefWithGenerics extends FC<WithForwardRefProps<Option>> {
  <T extends Option>(
    props: WithForwardRefProps<T>
  ): ReturnType<FC<WithForwardRefProps<T>>>;
}
