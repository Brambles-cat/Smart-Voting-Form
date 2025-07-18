"use client"

import { useState } from "react";
import LabelsTab from "./LabelsTab";
import StatsTab from "./StatsTab";
import VideoPoolTab from "./VideoPoolTab";
import styles from "../page.module.css"
import { video_metadata } from "@/generated/prisma";
import { LabelConfig } from "@/lib/types";

const tabs = ["Stats", "Labels", "Pool"]

interface Props {
  labelConfigs: LabelConfig[]
  videoPool0: video_metadata[],
}

export default function ControlPanel({ labelConfigs, videoPool0 }: Props) {
  const [activeTab, setActiveTab] = useState("Labels")

  return (
    <div className={styles.mainContainer}>
      <div className={styles.tabContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? styles.activeTab : styles.tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {
        activeTab === "Stats" && <StatsTab /> ||
        activeTab === "Labels" && <LabelsTab labelConfigs={labelConfigs}/> ||
        activeTab === "Pool" && <VideoPoolTab />
      }
    </div>
  )
}
