"use client"

import { useState } from "react";
import LabelsTab from "./LabelsTab";
import DataTab from "./DataTab";
import VideoPoolTab from "./VideoPoolTab";
import styles from "../page.module.css"
import { video_metadata } from "@/generated/prisma";
import { Flag } from "@/lib/types";

const tabs = ["Data", "Labels", "Pool"]

interface Props {
  labelConfigs: Flag[]
  videoPool0: video_metadata[],
}

export default function ControlPanel({ labelConfigs, videoPool0 }: Props) {
  const [activeTab, setActiveTab] = useState("Labels")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pageVideoPool, setPageVideoPool] = useState(videoPool0)

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
        activeTab === "Data" && <DataTab /> ||
        activeTab === "Labels" && <LabelsTab labelSettings={labelConfigs}/> ||
        activeTab === "Pool" && <VideoPoolTab />
      }
    </div>
  )
}
