import { Calendar, ChevronDown } from 'lucide-react';
const allSymptoms = ['Headache', 'Fever', 'Drowsiness', 'Body Weakness'];
export function BioDataForm() {
  return (
    <form className="p-8">
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-semibold text-gray-800">
          Captured Bio Data
        </h3>
        <p className="text-gray-600">
          This form displays the bio data submitted by the user.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* First Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none"
          />
        </div>

        {/* Age */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Gender
          </label>
          <div className="relative">
            <select className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none">
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          </div>
        </div>

        {/* Date of Start of Symptoms */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Date of Start of Symptoms
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none"
            />
            <Calendar className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          </div>
        </div>

        {/* Test Results */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Test Results (if applicable)
          </label>
          <div className="relative">
            <select className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none">
              <option value="Unknown">Unknown</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
            </select>
            <ChevronDown className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          </div>
        </div>
      </div>

      {/* Mosquito Species */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Mosquito Species (if applicable)
        </label>
        <div className="relative">
          <select className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none">
            <option value="Mixed">Mixed</option>
            <option value="Anopheles">Anopheles</option>
            <option value="Aedes">Aedes</option>
          </select>
          <ChevronDown className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        </div>
      </div>

      {/* Select Symptoms */}
      <div>
        <label className="mb-4 block text-sm font-medium text-gray-700">
          Select Symptoms
        </label>
        <div className="space-y-3">
          {allSymptoms.map((symptom) => {
            const isSelected = symptom;
            return (
              <label key={symptom} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 bg-gray-100 text-green-600 focus:ring-green-500 disabled:opacity-50"
                />
                <span
                  className={`ml-3 text-sm ${isSelected ? 'font-medium text-gray-800' : 'text-gray-500'}`}
                >
                  {symptom}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </form>
  );
}
