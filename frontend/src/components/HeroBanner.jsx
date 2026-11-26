const DESTINATIONS = [
  {
    name: "🇯🇵 Tokyo",
    prompt: "Plan a 7-day Tokyo trip with flights, hotels, and sightseeing",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=70",
  },
  {
    name: "🇫🇷 Paris",
    prompt: "Paris trip for 5 days including flights, boutique hotels, and highlights",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&q=70",
  },
  {
    name: "🇹🇭 Bangkok",
    prompt: "5-day Bangkok trip with street food, temples, flights, and hotels",
    img: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=300&q=70",
  },
  {
    name: "🇮🇹 Rome",
    prompt: "6-day Rome cultural itinerary with flights and central hotels",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=300&q=70",
  },
  {
    name: "🇦🇪 Dubai",
    prompt: "Dubai weekend trip with desert safari, hotels, and flights",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=70",
  },
];

export default function HeroBanner({ onSelectDestination }) {
  return (
    <div className="mb-6">
      <div className="relative mb-6 h-[260px] overflow-hidden rounded-[20px] border border-line sm:h-[280px]">
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&q=80"
          alt="Airplane above clouds"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.35]"
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <span className="mb-3.5 inline-block rounded-full border border-[#3a7bd5]/50 bg-[#3a7bd5]/25 px-3.5 py-1 text-xs font-semibold tracking-[0.12em] text-[#7ab8f5] uppercase">
            ✦ Multi-Agent AI System
          </span>
          <h1 className="mb-2.5 text-3xl font-bold leading-tight text-white sm:text-[2.6rem]">
            ✈️ AI Travel Booking System
          </h1>
          <p className="max-w-[560px] text-sm text-[#94adc8] sm:text-base">
            Four specialized agents work together — searching flights, hotels, building an itinerary, and delivering your perfect trip plan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {DESTINATIONS.map((dest) => (
          <button
            key={dest.name}
            type="button"
            onClick={() => onSelectDestination?.(dest.prompt)}
            className="group relative h-[90px] overflow-hidden rounded-[10px] border border-line text-left transition hover:border-[#3a7bd5]"
          >
            <img
              src={dest.img}
              alt={dest.name}
              className="h-full w-full object-cover brightness-[0.55] transition duration-300 group-hover:scale-105 group-hover:brightness-[0.7]"
            />
            <span className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-white drop-shadow">
              {dest.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
