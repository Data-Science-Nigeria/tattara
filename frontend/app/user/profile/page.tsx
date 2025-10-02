export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-semibold text-gray-900 sm:text-3xl">
        Profile
      </h1>

      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col items-center gap-6 border-b border-gray-200 pb-8 sm:flex-row sm:items-start">
          {/* Profile Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-300">
            <svg
              className="h-12 w-12 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
              1.79-4 4 1.79 4 4 4zm0 2c-2.67 
              0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </div>

          {/* Profile Info */}
          <div className="text-center sm:text-left">
            <h2 className="mb-1 text-xl font-semibold text-gray-900 sm:text-2xl">
              Abeni Coker
            </h2>
            <p className="text-sm text-gray-600 sm:text-base">
              abenicoker@email.com
            </p>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="border-b pb-8">
          <h3 className="mb-6 text-lg font-semibold text-gray-900 sm:text-xl">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {/* First Name */}
            <div>
              <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                First Name
              </h4>
              <p className="text-sm text-gray-600 sm:text-base">Abeni</p>
            </div>

            {/* Last Name */}
            <div>
              <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                Last Name
              </h4>
              <p className="text-sm text-gray-600 sm:text-base">Coker</p>
            </div>

            {/* Age */}
            <div>
              <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                Age
              </h4>
              <p className="text-sm text-gray-600 sm:text-base">21</p>
            </div>

            {/* Gender */}
            <div>
              <h4 className="mb-1 text-sm font-medium text-gray-900 sm:text-base">
                Gender
              </h4>
              <p className="text-sm text-gray-600 sm:text-base">Female</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
