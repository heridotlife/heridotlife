import URLForm from '@/components/admin/URLForm';

export default function NewURLPage() {
  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-700 dark:from-sky-300 dark:via-cyan-200 dark:to-blue-300'>
          Create New Short URL
        </h1>
        <p className='text-sky-600 dark:text-sky-400 mt-2'>
          Add a new short URL to your collection
        </p>
      </div>

      <div className='bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 dark:border-sky-700 p-6'>
        <URLForm />
      </div>
    </div>
  );
}
