import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/set')({
  component: SetUserPage,
});

function SetUserPage(): JSX.Element {
  const context = Route.useRouteContext();

  function setUser(): void {
    context.core.user.set({
      userType: 'local',
      name: 'John Doe',
      email: 'john.doe@example.com',
      language: 'en',
    });
  }

  return (
    <div className="p-2">
      <button onClick={setUser}>Create User</button>
    </div>
  );
}
