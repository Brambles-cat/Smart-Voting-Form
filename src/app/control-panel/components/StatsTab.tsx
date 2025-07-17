"use client";

import { useState } from "react";

export default function StatsTab() {
  const [imgSrc, setImgSrc] = useState("/placeholder.png");

  const refreshImage = () => {
    setImgSrc(`/placeholder.png?${Date.now()}`);
  };

  return (
    <div className="flex flex-col items-center">
      <img src={imgSrc} alt="Preview" className="w-64 h-64 object-contain border" />
      <button onClick={refreshImage} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
        Refresh
      </button>
    </div>
  );
}