import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/set')({
  component: SetUserPage,
});

function SetUserPage() {
  const context = Route.useRouteContext();

  function setUser() {
    context.core.user.set({
      userType: 'local',
      name: 'John Doe',
      email: 'john.doe@example.com',
      locale: {
        id: 'en',
        name: 'English',
      },
    });
  }

  return (
    <div className="p-2">
      <button onClick={setUser}>Create User</button>
    </div>
  );
}
