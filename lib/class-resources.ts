// Links pinned to a class's learner dashboard (Resources section), keyed by
// class code. A class with no entry shows no Resources section.

export type ClassResource = {
  title: string;
  description: string;
  url: string;
  icon: string;
};

const RESOURCES: Record<string, ClassResource[]> = {
  IGNITE: [
    {
      title: "Tinkercad class",
      description: "Join our Tinkercad class to design your 3D prints.",
      url: "https://www.tinkercad.com/joinclass/JA9N6AAZE",
      icon: "🧊",
    },
  ],
};

export function classResources(classCode: string): ClassResource[] {
  return RESOURCES[classCode.toUpperCase()] ?? [];
}
