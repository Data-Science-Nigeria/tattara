import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import Footer from '../../components/footer';

const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="mb-14 rounded-2xl border-[#DBDCEA]">
          <CardContent className="p-8">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-[#373844]">
                Password Reset Successful
              </h1>
              <p className="text-sm text-[#5C5D6C]">
                Your password has been successfully reset. You can now log in
                with your new password.
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/auth/login">
                <Button className="mt-2 mb-2 w-full rounded-md bg-[#008647] py-6 text-center">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        <Footer />
      </div>
    </div>
  );
};

export default page;
