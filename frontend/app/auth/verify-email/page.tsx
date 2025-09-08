'use client';
import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';

const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="mb-12 text-center">
              <h1 className="mb-2 text-3xl font-bold text-[#373844]">
                Verify Your Email
              </h1>
              <p className="text-xs text-[#5C5D6C]">
                We&apos;ve sent a verification link to your email
              </p>
            </div>

            <div className="mb-12 flex justify-center">
              <div className="relative h-20 w-20">
                <svg
                  className="h-20 w-20 -rotate-90 transform animate-spin"
                  viewBox="0 0 80 80"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#16a34a"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="201"
                    strokeDashoffset="67"
                    strokeLinecap="round"
                    className=""
                  />
                </svg>
              </div>
            </div>
            <Link href={'/admin/overview'}>
              <Button className="mt-1 w-full rounded-lg bg-[#008647] py-6 text-center text-sm">
                Continue
              </Button>
            </Link>

            <div className="mt-3 text-center">
              <span className="text-xs text-[#5C5D6C]">
                Didn&apos;t get the link?{' '}
              </span>
              <button className="text-xs text-[#008647] hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                Resend Email
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default page;
