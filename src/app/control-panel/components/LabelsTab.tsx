"use client";

import { useState } from "react";
import styles from "../page.module.css";
import Image from "next/image";
import VoteField from "@/app/components/vote_field";

const presetLabelConfig = [
  { name: "A1", type: "x", details: "Alpha", triggeredBy: "Rule 1" },
  { name: "B2", type: "warn", details: "Bravo", triggeredBy: "Rule 3" },
  { name: "C3", type: "x", details: "Charlie", triggeredBy: "Rule 2" },
  { name: "D4", type: "warn", details: "Delta", triggeredBy: "Rule 4" },
];

export default function LabelsTab() {
  const [labels, setLabels] = useState(presetLabelConfig);

  const handleChange = (
    index: number,
    key: "name" | "type" | "details",
    value: string
  ) => {
    const updated = [...labels];
    updated[index][key] = value;
    setLabels(updated);
  };

  return (
    <div className={styles.tabContents}>
      <VoteField
        index={0}
        fieldInput=""
        fieldFlags={[]}
        displayData={undefined}
        onChanged={() => {}}
        onPaste={() => {}}
      />

      {labels.map((labelConfig, index) => (
        <div key={index} className={styles.labelSettings}>
          <div className={styles.hoverInfo}>
            <div className={styles.triggeredBy}>Triggered by: {labelConfig.triggeredBy}</div>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              value={labelConfig.name}
              onChange={(e) => handleChange(index, "name", e.target.value)}
              className={styles.labelNameField}
              placeholder="Name"
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              value={labelConfig.details}
              onChange={(e) => handleChange(index, "details", e.target.value)}
              className={styles.labelDetailsField}
              placeholder="Details"
            />
          </div>

          <div className={styles.inputGroup} style={{ position: "relative" }}>
            <button
              className={styles.iconButton}
              onClick={() => handleChange(index, "type", labels[index].type === "x" ? "warn" : "x")}
            >
              <Image
                src={`${labelConfig.type}.svg`}
                alt=""
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>
      ))}

      <button className={styles.saveButton}>Save</button>
    </div>
  );
}
