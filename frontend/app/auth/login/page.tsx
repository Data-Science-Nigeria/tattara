import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { LoginForm } from './components/login-form';
import Logo from '../../components/logo';

const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5FF] px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl border-[#DBDCEA] shadow-lg">
          <CardContent className="p-8">
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default page;
