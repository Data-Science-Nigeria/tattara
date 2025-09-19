import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl p-6">
      {/* Select Form Section */}
      <div className="mb-12">
        <h1 className="mb-8 text-3xl font-semibold text-gray-900">
          Select Form
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Child Registration - Selected */}
          <div className="relative">
            <input
              type="radio"
              id="child-registration"
              name="form-type"
              value="child-registration"
              className="peer sr-only"
            />
            <label
              htmlFor="child-registration"
              className="flex cursor-pointer rounded-2xl border-2 border-green-500 bg-green-50 p-6 transition-all hover:border-green-600"
            >
              <div className="flex w-full items-start gap-4">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-green-500 bg-green-500">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-medium text-gray-900">
                    Child Registration
                  </h3>
                  <p className="leading-relaxed text-gray-600">
                    Capture essential details to create and manage a childs
                    health record.
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Malaria Surveillance - Unselected */}
          <div className="relative">
            <input
              type="radio"
              id="malaria-surveillance"
              name="form-type"
              value="malaria-surveillance"
              className="peer sr-only"
            />
            <label
              htmlFor="malaria-surveillance"
              className="flex cursor-pointer rounded-2xl border-2 border-gray-200 p-6 transition-all peer-checked:border-green-500 peer-checked:bg-green-50 hover:border-green-500"
            >
              <div className="flex w-full items-start gap-4">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 peer-checked:border-green-500 peer-checked:bg-green-500">
                  <div className="h-2 w-2 rounded-full bg-white opacity-0 peer-checked:opacity-100"></div>
                </div>
                <div className="flex-1">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-medium text-gray-900">
                    Malaria Surveillance
                  </h3>
                  <p className="leading-relaxed text-gray-600">
                    Record and track malaria cases to strengthen early detection
                    and response.
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Select Input Type Section */}
      <div>
        <h2 className="mb-8 text-3xl font-semibold text-gray-900">
          Select Input Type
        </h2>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {/* Form Card */}

          <div className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white transition-all hover:border-green-500 hover:shadow-md">
            <Link href={'/'}>
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Form</h3>
              </div>
            </Link>
          </div>

          {/* Image Card */}
          <div className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white transition-all hover:border-green-500 hover:shadow-md">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Image</h3>
            </div>
          </div>

          {/* Audio Card */}
          <div className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white transition-all hover:border-green-500 hover:shadow-md">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Audio</h3>
            </div>
          </div>

          {/* Text Card */}
          <div className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white transition-all hover:border-green-500 hover:shadow-md">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Text</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
