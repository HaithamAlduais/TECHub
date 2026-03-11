type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;
  return (
    <main className="mx-auto max-w-4xl px-4 py-24">
      <h1 className="text-3xl font-bold">@{username}</h1>
      <p className="mt-3 text-muted-foreground">
        Sprint 1 skeleton: public profile view with level and class.
      </p>
    </main>
  );
}
