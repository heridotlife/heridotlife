'use client';

import clsx from 'clsx';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import Button from '@/components/buttons/Button';
import UnderlineLink from '@/components/links/UnderlineLink';

type Color = 'sky' | 'blue' | 'red'; // Add this line to define the Color type

export default function HomePage() {
  const [mode, setMode] = React.useState<'dark' | 'light'>('light');
  const [color] = React.useState<Color>('sky');
  function toggleMode() {
    return mode === 'dark' ? setMode('light') : setMode('dark');
  }

  return (
    <main>
      <Head>
        <title>Hi</title>
      </Head>
      <section
        className={clsx(mode === 'dark' ? 'bg-dark' : 'bg-white', color)}
      >
        <div className='absolute top-0 right-0 m-4 mt-4 flex flex-wrap gap-3'>
          <Button
            onClick={toggleMode}
            variant={mode === 'dark' ? 'light' : 'dark'}
          >
            Set to {mode === 'dark' ? 'light' : 'dark'}
          </Button>
          {/* <Button onClick={randomize}>Randomize CSS Variable</Button> */}
        </div>
        <div
          className={clsx(
            'layout min-h-screen py-20',
            mode === 'dark' ? 'text-white' : 'text-black',
          )}
        >
          <div className='layout relative flex min-h-screen flex-col items-center justify-center py-12 text-center'>
            <div className="relative flex place-items-center before:absolute before:h-[480px] before:w-[400px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
              {/* Profile Picture */}
              <Image
                className='object-cover w-32 h-32 rounded-full'
                src='/profile_picture.jpg'
                alt='Profile Picture'
                width={150}
                height={150}
                priority
              />
            </div>

            {/* Profile Info */}
            <div className='text-center mt-8'>
              <h1 className='text-4xl font-bold'>Heri Rusmanto</h1>
              <p className='text-lg mt-4'>Automation enthusiast</p>

              {/* LinkedIn Link */}
              <div className='mt-4'>
                <Link
                  href='https://www.linkedin.com/in/hveda/'
                  target='_blank'
                  className='text-blue-600 hover:underline'
                >
                  Connect with me on LinkedIn
                </Link>
              </div>
            </div>

            <div className='mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left'>
              {/* Additional sections can be added here */}
            </div>
            {/* <Logo className='w-16' />
            <h1 className='mt-4'>Next.js + Tailwind CSS + TypeScript Starter</h1>
            <p className='mt-2 text-sm text-gray-800'>
              A starter for Next.js, Tailwind CSS, and TypeScript with Absolute
              Import, SEO, Link component, pre-configured with Husky
            </p>
            <p className='mt-2 text-sm text-gray-700'>
              <ArrowLink href='https://github.com/theodorusclarence/ts-nextjs-tailwind-starter'>
                See the repository
              </ArrowLink>
            </p>

            <ButtonLink className='mt-6' href='/components' variant='light'>
              See all components
            </ButtonLink>

            <UnstyledLink
              href='https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Ftheodorusclarence%2Fts-nextjs-tailwind-starter'
              className='mt-4'
            >
              <img
                width='92'
                height='32'
                src='https://vercel.com/button'
                alt='Deploy with Vercel'
              />
            </UnstyledLink> */}

            <footer className='absolute bottom-2 text-gray-700'>
              © {new Date().getFullYear()} By{' '}
              <UnderlineLink href='https://heri.life?ref=tsnextstarter'>
                Heri Rusmanto
              </UnderlineLink>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
