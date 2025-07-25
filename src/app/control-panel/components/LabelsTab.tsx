"use client";

import { useRef, useState } from "react";
import styles from "../page.module.css";
import Image from "next/image";
import VoteField from "@/app/components/vote_field";
import { testLink } from "@/lib/util";
import { label_config } from "@/generated/prisma";
import { validate } from "@/lib/api";
import { BallotEntryField } from "@/lib/types";
import { iconMap, labels } from "@/lib/labels";

interface Props {
  labelSettings: label_config[]
}

export default function LabelsTab({ labelSettings }: Props) {
  const [voteFields, setVoteFields] = useState<BallotEntryField[]>([{ flags: [], videoData: null, input: "" }])
  const [labelsConfigs, setLabels] = useState(labelSettings)
  const inputTimeouts = useRef<NodeJS.Timeout[]>([])

  const labelChange = (index: number, newVals: Partial<label_config>) => {
    const updated = [...labelsConfigs]
    updated[index] = { ...updated[index], ...newVals }
    setLabels(updated)
  }

  const updateField = (index: number, newFieldVals: Partial<BallotEntryField>) => {
    const updated = [...voteFields]
    updated[index] = { ...updated[index], ...newFieldVals }
    setVoteFields(updated)
  }

  /**
   * Rerender the page using the results of the validation request
   */
  const applyValidation = async (input: string, field_index: number) => {
    const { field_flags, video_data } = await validate(input)
    updateField(field_index, { input, flags: field_flags, videoData: video_data || null })
  }

  const changed = async (e: React.ChangeEvent<HTMLInputElement>, field_index: number) => {    
    const input = e.currentTarget.value.trim()
    const isLink = testLink(input)

    if (!input)
      updateField(field_index, { input, videoData: null, flags: [] })
    else if (!isLink)
      updateField(field_index, { input, videoData: null, flags: [labels.invalid_link] })
    else if (isLink.length)
      updateField(field_index, { input, videoData: null, flags: isLink })
    else {
      clearTimeout(inputTimeouts.current[field_index])
      updateField(field_index, { input, videoData: undefined, flags: [] })
      inputTimeouts.current[field_index] = setTimeout(() => applyValidation(input, field_index), 2500)
    }
  }

  return (
    <div className={styles.tabContents}>
      <div className={styles.testFields}>
        {voteFields.map((field, i) =>
          <VoteField
            key={i}
            index={i}
            fieldInput={field.input}
            fieldFlags={field.flags}
            displayData={field.videoData}
            onChanged={changed}
            onPaste={() => {}}
          />
        )}
      </div>

      <div className={styles.buttonRow}>
        { voteFields.length < 10 &&
          <button className={styles.addFieldBtn}
          onClick={() => setVoteFields([...voteFields, { flags: [], videoData: null, input: "" }])}>+</button>
        }
        { voteFields.length > 1 &&
          <button className={styles.subFieldBtn}
          onClick={() => setVoteFields(voteFields.slice(0, -1))}>-</button>
        }
      </div>

      {labelsConfigs.map((labelConfig, index) => (
        <div key={index} className={styles.labelSettings}>
          <div className={styles.hoverInfo}>
            <div className={styles.triggeredBy}>Triggered by: {labelConfig.trigger}</div>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="text"
              value={labelConfig.name}
              onChange={(e) => labelChange(index, { name: e.target.value })}
              className={styles.labelNameField}
              placeholder="Name"
            />

            <input
              type="text"
              value={labelConfig.details}
              onChange={(e) => labelChange(index, { details: e.target.value })}
              className={styles.labelDetailsField}
              placeholder="Details"
            />

            <button
              className={styles.iconButton}
              onClick={() => labelChange(index, { type: labelsConfigs[index].type === "x" ? "warn" : "x"})}
            >
              <Image
                src={`${iconMap[labelConfig.type as keyof typeof iconMap]}.svg`}
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
