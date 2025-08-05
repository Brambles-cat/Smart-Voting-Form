import Image from "next/image";
import styles from "../page.module.css";
import { client_labels, labelStamp } from "@/lib/labels";

interface Props {
  cli_labels: client_labels,
  eligibleCount: number;
  uniqueCreatorCount: number;
}

export default function VoteCounter({ cli_labels, eligibleCount, uniqueCreatorCount }: Props) {
  const has5 = eligibleCount >= 5
  const diverse = uniqueCreatorCount >= 5
  const minStamp = labelStamp(cli_labels.too_few_votes, has5)
  const diversityStamp = labelStamp(cli_labels.diversity_rule, diverse)

  // Prioritize severity, then 5 channel minimum over diversity
  const stamp = minStamp.severity >= diversityStamp.severity ? minStamp : diversityStamp

  return (
    <div className={styles.eligible_count}>
      <b>{eligibleCount}/{has5 ? 10 : 5}</b>{" "}
      {has5 && <Image src={stamp.icon} alt="" width={20} height={20}/>}

      <div className={`${styles.eligible_count_note} ${[styles.good, styles.warn, styles.ineligible][stamp.severity]}`}>
      {
        !stamp.severity ?
        "Minimum 5 eligible vote requiremnt met!" :

        stamp === minStamp ?
        minStamp.label.details :

        <div>
          {diversityStamp.label.details}
          <div>
            <b>{uniqueCreatorCount}/5</b> unique creators present
          </div>
        </div>
      }
      </div>
    </div>
  )
}
