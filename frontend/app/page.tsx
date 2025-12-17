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
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const page = () => {
  const features = [
    {
      icon: '/capture.svg',
      title: 'Capture Data',
      description:
        'Record your conversations or\nupload  past records as audio or\nphotos — no manual entry\n needed.',
    },

    {
      icon: '/ai.svg',
      title: 'AI Processing',
      description:
        ' Intelligent pipelines extract\ndetails and run checks for\naccuracy.',
    },

    {
      icon: '/integration.svg',
      title: 'Instant Integration',
      description:
        'Your clean data flows directly into\nyour database, DHIS2 database,\nor any data storage of your\nchoice.',
    },
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col bg-white px-4 sm:px-6 md:px-8">
      <Header />
      <section className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-[#BAC7DF] bg-white lg:h-[840px] lg:flex-row">
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-20">
          <div className="z-20">
            <h1 className="mb-4 text-4xl leading-tight font-bold text-[#494A58] sm:text-5xl md:text-5xl lg:text-6xl">
              Tattara Data Collection <br />
              and Entry App
            </h1>
            <p className="text-lg text-[#494A58]">
              Supercharge your data collection with AI. Simply record your
              voice, or upload an audio file or photo — AI instantly extracts,
              validates, and processes your data.{' '}
            </p>
            <p className="mb-8 text-lg text-[#494A58]">
              Keep your records clean, accurate, and effortless, all within your
              app of choice.
            </p>
            <Link href={'/auth/login'}>
              <Button size="lg" className="mb-8 h-12 w-48 bg-[#008647]">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <img
            src={'/grid.svg'}
            className="absolute inset-0 z-10 h-full w-full object-cover"
          />
          <div
            className="absolute bottom-0 left-0 z-0 h-80 w-80 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, #33B97A, #65BE95)' }}
          />
          <div
            className="absolute bottom-0 left-72 z-0 h-[266px] w-[266px] rounded-full blur-2xl"
            style={{ backgroundColor: '#0181DA3D' }}
          />
        </div>
        <div className="relative z-10 h-[400px] w-full rounded-b-3xl lg:h-full lg:w-[601px] lg:rounded-r-3xl lg:rounded-bl-none">
          <Image
            src={'/dhis.svg'}
            className="absolute h-full w-full rounded-b-3xl object-cover lg:rounded-r-3xl lg:rounded-bl-none"
            alt="hero image"
            fill
          />
        </div>
        <div className="absolute inset-0 top-0 w-full bg-gradient-to-r from-[#FCFCFC] to-[#B5CBF6] py-8 blur-2xl" />
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
                className={`border border-[#D2DDF5] bg-[#F8FAFC] shadow-sm ${index % 2 === 0 ? 'lg:animate-[tilt-left_4s_ease-in-out_infinite]' : 'lg:animate-[tilt-right_4s_ease-in-out_infinite]'}`}
              >
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-green-100">
                    <img
                      src={feature.icon}
                      className="h-8 w-8"
                      alt={feature.title}
                    />
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
