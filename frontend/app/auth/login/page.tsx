import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { LoginForm } from './components/login-form';
import Footer from '../../components/footer';

const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-lg">
        <Card className="rounded-2xl border-[#DBDCEA]">
          <CardContent className="p-10">
            <LoginForm />
          </CardContent>
        </Card>
        <Footer />
      </div>
    </div>
  );
};

export default page;
