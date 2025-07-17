"use client";

import { useState } from "react";

const items = ["Item 1", "Item 2", "Item 3", "Item 4"]

export default function VideoPoolTab() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item, idx) => (
        <div key={idx} className="relative border p-4 rounded shadow">
          <div>{item}</div>
          <div className="absolute top-2 right-2">
            <MenuButton />
          </div>
        </div>
      ))}
    </div>
  )
}

function MenuButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen((prev) => !prev)} className="px-2">&#8942;</button>
      {open && (
        <div className="absolute right-0 top-full bg-white border rounded shadow-md">
          {[
            "Edit label",
            "Hide",
            "Hide creator",
            "Edit source",
          ].map((option) => (
            <div
              key={option}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setOpen(false);
                console.log(option);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
