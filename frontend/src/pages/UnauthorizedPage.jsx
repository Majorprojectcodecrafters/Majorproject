export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">403</h1>
        <p className="mt-2 text-lg text-gray-600">Unauthorized</p>
        <p className="mt-1 text-sm text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>
  );
}
