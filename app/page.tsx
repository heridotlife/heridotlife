import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-36">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[480px] before:w-[400px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
        {/* Profile Picture */}
        <Image
          className="object-cover w-32 h-32 rounded-full"
          src="/profile_picture.jpg"
          alt="Profile Picture"
          width={150}
          height={150}
          priority
        />
      </div>

      {/* Profile Info */}
      <div className="text-center mt-8">
        <h1 className="text-4xl font-bold">Heri Rusmanto</h1>
        <p className="text-lg mt-4">Software Engineer, Farmer, and more...</p>

        {/* LinkedIn Link */}
        <div className="mt-4">
          <Link href="https://www.linkedin.com/in/hveda/" target="_blank" className="text-blue-600 hover:underline">
            Connect with me on LinkedIn
          </Link>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
        {/* Additional sections can be added here */}
      </div>
    </main>
  )
}
