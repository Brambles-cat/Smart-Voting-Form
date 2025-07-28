import ConstructionZone from "@/app/placeholder";

export default function StatsTab() {

  return (
    process.env.NODE_ENV === "production" && <ConstructionZone/> ||

    <div>Meow</div>
  )
}