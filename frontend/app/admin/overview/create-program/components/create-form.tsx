import { CircleX } from 'lucide-react';
import React from 'react';

const CreateForm = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[rgba(12,16,20,0.88)] px-7 py-7 backdrop-blur-sm">
      <div className="h-[650px] w-[704px] rounded-2xl bg-white p-12">
        <div className="mb-8 flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2F3A4C]">
              Create Program
            </h1>
            <p className="text-sm text-[#7987A0]">
              Create a new program for users follow
            </p>
          </div>
          <button>
            <CircleX />
          </button>
        </div>
        <form className="mb-8">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter your Title"
              className="w-full rounded-md border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-3"
            />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Description
            </label>
            <input
              type="text"
              placeholder="Description"
              className="w-full rounded-md border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-8"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600">
              Assign User
            </label>
            <input
              type="text"
              placeholder="Assign User"
              className="w-full rounded-md border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-3"
            />
          </div>
        </form>
        <div className="flex justify-end">
          <div className="flex justify-between gap-4">
            <button className="px-4 py-3 text-[#999AAA]">Cancel</button>
            <button className="rounded-md bg-green-800 px-6 py-3 text-white">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateForm;
