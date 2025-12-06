import React from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import Link from 'next/link';
import Header from './components/header';
import Footer from './components/footer';
import { Mic, Brain, Database } from 'lucide-react';

const page = () => {
  const features = [
    {
      icon: Mic,
      title: 'Capture Data',
      description:
        'Record your conversations or\nupload  past records as audio or\nphotos — no manual entry\n needed.',
    },

    {
      icon: Brain,
      title: 'AI Processing',
      description:
        ' Intelligent pipelines extract\ndetails and run checks for\naccuracy.',
    },

    {
      icon: Database,
      title: 'Instant Integration',
      description:
        'Your clean data flows directly into\nyour database, DHIS2 database,\nor any data storage of your\nchoice.',
    },
  ];
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <section className="mx-6 rounded-3xl border border-[#D2DDF5] bg-gradient-to-b from-[#F5F5FF] to-[#BAC7DF] py-16 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold text-[#494A58] md:text-5xl">
            Tattara Data Collection and Entry App
          </h1>
          <p className="font-semibold text-[#494A58]">
            Supercharge your data collection with AI. Simply record your voice,
            or upload an <br /> audio file or photo — AI instantly extracts,
            validates, and processes your data.{' '}
          </p>
          <p className="mb-8 text-[#707180]">
            Keep your records clean, accurate, and effortless, all within your
            app of choice.
          </p>
          <Link href={'/auth/login'}>
            <Button size="lg" className="mb-8 bg-[#008647] px-8 py-3">
              Get Started
            </Button>
          </Link>
          <img src={'/landing page.svg'} alt="landingpage" className="" />
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="mb-8 border border-[#D2DDF5] bg-[#FCFCFF] py-4 text-center">
          <h2 className="text-2xl font-bold text-[#2F3A4C]">
            How Tattara works:
          </h2>
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <div className="mt-10 grid grid-cols-1 gap-16 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`border border-[#D2DDF5] bg-[#F8FAFC] shadow-sm ${index % 2 === 0 ? 'animate-[tilt-left_4s_ease-in-out_infinite]' : 'animate-[tilt-right_4s_ease-in-out_infinite]'}`}
              >
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-green-100">
                    <feature.icon className="h-8 w-8 text-[#008647]" />
                  </div>
                  <CardTitle className="text-xl text-[#5C5D6C]">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="">
                  <CardDescription className="text-sm whitespace-pre-line text-[#848595]">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default page;
