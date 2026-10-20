import { Heart, Bike, Sparkles, WandSparkles, Clapperboard, Flower2, Gamepad2, IceCreamCone, Sun, Gift } from 'lucide-react';
const icons={heart:Heart,bike:Bike,'sparkles-heart':Heart,wand:WandSparkles,clapper:Clapperboard,flower:Flower2,gamepad:Gamepad2,icecream:IceCreamCone,sun:Sun};
export default function ValeIcon({tipo,size=32}){const Icon=icons[tipo]||Gift;return <span className={`vale-illustration ico-${tipo||'gift'}`}><Icon size={size} strokeWidth={1.8}/>{tipo==='sparkles-heart'&&<Sparkles size={14} className="extra-sparkle"/>}</span>}
