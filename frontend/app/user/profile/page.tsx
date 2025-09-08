export default function HomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-6">
      {/* Profile Header */}
      <h1 className="mb-8 text-3xl font-semibold text-gray-900">Profile</h1>

      {/* Profile Section */}
      <div className="mb-8 flex items-center gap-6 border-b border-gray-200 pb-8">
        {/* Profile Avatar */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-300">
          <svg
            className="h-12 w-12 text-gray-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        {/* Profile Info */}
        <div>
          <h2 className="mb-1 text-2xl font-semibold text-gray-900">
            Abeni Coker
          </h2>
          <p className="text-gray-600">abenicoker@email.com</p>
        </div>
      </div>

      {/* Personal Information Section */}
      <div>
        <h3 className="mb-6 text-xl font-semibold text-gray-900">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
          {/* First Name */}
          <div>
            <h4 className="mb-1 text-base font-medium text-gray-900">
              First Name
            </h4>
            <p className="text-gray-600">Abeni</p>
          </div>

          {/* Last Name */}
          <div>
            <h4 className="mb-1 text-base font-medium text-gray-900">
              Last Name
            </h4>
            <p className="text-gray-600">Coker</p>
          </div>

          {/* Age */}
          <div>
            <h4 className="mb-1 text-base font-medium text-gray-900">Age</h4>
            <p className="text-gray-600">21</p>
          </div>

          {/* Gender */}
          <div>
            <h4 className="mb-1 text-base font-medium text-gray-900">Gender</h4>
            <p className="text-gray-600">Female</p>
          </div>
        </div>
      </div>
    </div>
  );
}
