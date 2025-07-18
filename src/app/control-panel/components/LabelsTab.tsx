"use client";

import { Dispatch, SetStateAction, useState } from "react";
import styles from "../page.module.css";
import Image from "next/image";
import VoteField from "@/app/components/vote_field";
import { testLink } from "@/lib/util";
import { label_config } from "@/generated/prisma";
import { validate } from "@/lib/api";
import { Flag } from "@/lib/types";

interface Props {
  labelConfigs: label_config[]
}

export default function LabelsTab({ labelConfigs }: Props) {
  const [labels, setLabels] = useState(labelConfigs)
  const [inputs, setInputs] = useState([""])
  const [videoData, setVideoData] = useState([""])
  const [initialFlags, setInitialFlags] = useState([null])

  const labelChange = (
    index: number,
    key: "name" | "type" | "details",
    value: string
  ) => {
    const updated = [...labels];
    updated[index][key] = value;
    setLabels(updated);
  };

  /**
   * Shorthand for updating the array states at a specified index
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateArr = (val: any, setter: Dispatch<SetStateAction<any[]>>, index: number) => {
    setter(old => {
      const updated = [...old]
      updated[index] = val
      return updated
    })
  }

  /**
   * Rerender the page using the results of the validation request
   * @param input user input, ideally a well formed link from a supported domain
   * @param field_index used by the server to save the entry's position
   */
  const applyValidation = async (input: string, field_index: number) => {
    const { field_flags, video_data } = await validate(input, field_index)
    updateArr(field_flags, setInitialFlags, field_index)
    updateArr(video_data || null, setVideoData, field_index)
  }

  const changed = async (e: React.ChangeEvent<HTMLInputElement>, field_index: number) => {    
    const input = e.currentTarget.value.trim()
    const isLink = testLink(input)

    updateArr(input, setInputs, field_index)
    updateArr(null, setVideoData, field_index)

    if (!input) {
      updateArr([], setInitialFlags, field_index)
    }
    else if (!isLink) {
      updateArr([{ type: "ineligible", note: "Not a valid link" } as Flag], setInitialFlags, field_index)
    }
    else if (isLink.length) {
      updateArr(isLink, setInitialFlags, field_index)
    }
    else {
      updateArr(undefined, setVideoData, field_index)
      applyValidation(input, field_index)
    }
  }

  return (
    <div className={styles.tabContents}>
      <VoteField
        index={0}
        fieldInput=""
        fieldFlags={[]}
        displayData={undefined}
        onChanged={changed}
        onPaste={() => {}}
      />

      {labels.map((labelConfig, index) => (
        <div key={index} className={styles.labelSettings}>
          <div className={styles.hoverInfo}>
            <div className={styles.triggeredBy}>Triggered by: {labelConfig.trigger}</div>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              value={labelConfig.name}
              onChange={(e) => labelChange(index, "name", e.target.value)}
              className={styles.labelNameField}
              placeholder="Name"
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              value={labelConfig.details}
              onChange={(e) => labelChange(index, "details", e.target.value)}
              className={styles.labelDetailsField}
              placeholder="Details"
            />
          </div>

          <div className={styles.inputGroup} style={{ position: "relative" }}>
            <button
              className={styles.iconButton}
              onClick={() => labelChange(index, "type", labels[index].type === "x" ? "warn" : "x")}
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
