'use client';

export default function Form() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-gray-900">
            Child Registration
          </h1>
          <p className="max-w-2xl text-gray-600">
            Register a child once, and keep their health records accurate and up
            to date in DHIS2. This ensures they get the right care at the right
            time.
          </p>
        </div>
        <button className="items-center justify-center rounded-md bg-green-600 px-4 py-6 font-medium text-white hover:bg-green-700 md:px-2 md:py-2">
          Reset Form
        </button>
      </div>

      <form className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              placeholder="Enter your First Name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              placeholder="Enter your Last Name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Age
            </label>
            <input
              type="number"
              placeholder="Enter your Age"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Gender
            </label>
            <div className="relative">
              <select className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <svg
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date of Start of Symptoms
            </label>
            <div className="relative">
              <input
                type="date"
                placeholder="Select Date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              {/* <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg> */}
            </div>
          </div>

          {/* Test Results */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Test Results{' '}
              <span className="text-gray-500">(if applicable)</span>
            </label>
            <div className="relative">
              <select className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="">Select Test Results</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="pending">Pending</option>
              </select>
              <svg
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Mosquito Species */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mosquito Species{' '}
            <span className="text-gray-500">(if applicable)</span>
          </label>
          <div className="relative">
            <select className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none">
              <option value="">Select Species</option>
              <option value="anopheles">Anopheles</option>
              <option value="aedes">Aedes</option>
              <option value="culex">Culex</option>
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Select Symptoms */}
        <div>
          <label className="mb-4 block text-sm font-medium text-gray-700">
            Select Symptoms
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-3 text-gray-700">Headache</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-3 text-gray-700">Fever</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-3 text-gray-700">Drowsiness</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-3 text-gray-700">Body Weakness</span>
            </label>
          </div>
        </div>

        {/* Submit Data Section */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            Submit Data
          </h3>
          <p className="mb-6 text-gray-600">
            Review your data and submit to the backend system.
          </p>

          {/* JSON Preview */}
          <div className="relative mb-6 rounded-lg bg-white p-4">
            <pre className="font-mono text-sm whitespace-pre-wrap text-gray-700">
              {`"events": [
 
          {
      "occurredAt": "2025-08-18",
      "notes": [],
      "program": "uKMyG20YTGk",
      "orgUnit": "DiszpKrYNg8",
      "dataValues": [
        {
          "dataElement": "UezIHP7jWKC",
          "value": ""
        },
        {
          "dataElement": "sYK4r0HjowV",
          "value": ""
        }
      ]
    }
            
      ]`}
            </pre>
            {/* Green indicator bar */}
            {/* <div className="absolute right-4 top-4 w-1 h-20 bg-green-500 rounded"></div> */}
          </div>

          {/* Submit Button */}
          <button className="items-end rounded-lg bg-green-600 px-6 py-3 text-lg font-medium text-white hover:bg-green-700">
            Send Data to Backend
          </button>
        </div>
      </form>
    </div>
  );
}
