import DrawingCanvas from "@/components/DrawingCanvas";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center  bg-black/35 h-full min-h-screen">
      <h1 className="text-3xl font-bold text-white ">Paint Art</h1>
      <h3 className="text-xl font-bold text-white ">Draw your thoughts!</h3>
      <DrawingCanvas />
    </main>
  );
}
