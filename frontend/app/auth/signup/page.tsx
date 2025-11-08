import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import Footer from '../../components/footer';
import { SignUpForm } from './components/signup-form';

const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="mb-14 rounded-2xl border-[#DBDCEA] shadow-lg">
          <CardContent className="p-8">
            <SignUpForm />
          </CardContent>
        </Card>
        <Footer />
      </div>
    </div>
  );
};

export default page;
