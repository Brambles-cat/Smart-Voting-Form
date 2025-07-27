"use client";

import { useRef, useState } from "react";
import styles from "../page.module.css";
import Image from "next/image";
import VoteField from "@/app/components/vote_field";
import { testLink } from "@/lib/util";
import { updateLabels, validate } from "@/lib/api";
import { BallotEntryField, Flag } from "@/lib/types";
import { iconMap, labels } from "@/lib/labels";
import { ballot_check } from "@/lib/vote_rules";

interface Props {
  labelSettings: Flag[]
}

export default function LabelsTab({ labelSettings }: Props) {
  const [voteFields, setVoteFields] = useState<BallotEntryField[]>([{ flags: [], videoData: null, input: "" }])
  const [labelsConfigs, setLabels] = useState(labelSettings)
  const inputTimeouts = useRef<NodeJS.Timeout[]>([])
  const pasting = useRef(false)

  const labelChange = (index: number, newVals: Partial<Flag>) => {
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

    clearTimeout(inputTimeouts.current[field_index])

    if (!input)
      updateField(field_index, { input, videoData: null, flags: [] })
    else if (!isLink)
      updateField(field_index, { input, videoData: null, flags: [labels.invalid_link] })
    else if (isLink.length)
      updateField(field_index, { input, videoData: null, flags: isLink })
    else if (pasting.current) {
      pasting.current = false
      updateField(field_index, { input, videoData: undefined })
      applyValidation(input, field_index)
    }
    else {
      updateField(field_index, { input, videoData: undefined, flags: [] })
      inputTimeouts.current[field_index] = setTimeout(() => applyValidation(input, field_index), 2500)
    }
  }

  const pasted = () => { pasting.current = true }

  const saveChanges = async () => {
    await updateLabels(labelsConfigs)
  }

  const newLabelMap = new Map<string, Flag>(labelSettings.map(s => [s.trigger, s]))
  const activeLabels = new Map<string, string>()
  let { uniqueCreators, eligible, checkedEntries } = ballot_check(voteFields)

  if (eligible.length < 5)
    activeLabels.set(labels.too_few_votes.trigger, newLabelMap.get(labels.too_few_votes.trigger)!.details)
  else if (uniqueCreators < 5)
    activeLabels.set(labels.diversity_rule.trigger, newLabelMap.get(labels.diversity_rule.trigger)!.details)

  // Apply label configuration fields (desc for now) for previewing
  checkedEntries = checkedEntries.map(e => (
    {
      ...e,
      flags: e.flags.map(f => {
        activeLabels.set(f.trigger, newLabelMap.get(f.trigger)?.details || f.details)
        return newLabelMap.get(f.trigger) || f 
      })
    }
  ))

  return (
    <div className={styles.tabContents}>
      <div className={styles.testFields}>
        {checkedEntries.map((field, i) =>
          <VoteField
            key={i}
            index={i}
            voteData={field}
            onChanged={changed}
            onPaste={pasted}
          />
        )}
      </div>

      <div className={styles.buttonRow}>
        { voteFields.length < 10 &&
          <button onClick={() => setVoteFields([...voteFields, { flags: [], videoData: null, input: "" }])}>+</button>
        }
        { voteFields.length > 1 &&
          <button onClick={() => setVoteFields(voteFields.slice(0, -1))}>-</button>
        }
      </div>

      <div className={styles.labelSettingsContainer}>
        {labelsConfigs.map((labelConfig, index) => (
          <div key={index} className={`${styles.labelSettings} ${activeLabels.has(labelConfig.trigger) && styles.activeLabel}`}>
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
                onClick={() => {
                  const t = labelsConfigs[index].type // TODO, turn this into an enum
                  labelChange(index, { type: t === "ineligible" && "warn" || t === "warn" && "disabled" || "ineligible"})
                }}
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
      </div>

      <button className={styles.saveButton} onClick={saveChanges}>Save</button>
    </div>
  )
}
