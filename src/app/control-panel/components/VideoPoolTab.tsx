"use client";

import ConstructionZone from "@/app/placeholder";
import { useEffect, useState } from "react";

export default function VideoPoolTab() {
  useEffect(() => {
    fetch("/api/pool").then(res => res)
  }, [])

  return (
    process.env.NODE_ENV === "production" && <ConstructionZone/> ||
    <></>
  )
}
