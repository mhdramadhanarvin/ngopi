import type { Route } from "./+types/page";
import { Brewing } from "./brewing";
// import { Welcome } from "./welcome";

export function meta(_props: Route.MetaArgs) {
  return [
    { title: "Brewing Assistant" },
    { name: "description", content: "Welcome to Brewing Assistant by mhdramadhanarvin!" },
  ];
}

export default function Page() {
  return <Brewing />;
}
