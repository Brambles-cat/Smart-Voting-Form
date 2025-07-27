import Image from "next/image";
import styles from "../page.module.css";
import { iconMap, labels } from "@/lib/labels";

interface Props {
  eligibleCount: number;
  uniqueCreatorCount: number;
}

export default function VoteCounter({ eligibleCount, uniqueCreatorCount }: Props) {
  const has5 = eligibleCount >= 5;

  return (
    <div className={styles.eligible_count}>
      <b>{eligibleCount}/{has5 ? 10 : 5}</b>{" "}
      {has5 && <Image src={(uniqueCreatorCount >= 5 ? iconMap.eligible : iconMap.ineligible) + ".svg"} alt="" width={20} height={20}/>}

      <div className={`${styles.eligible_count_note} ${has5 && (uniqueCreatorCount >= 5 && styles.good) || styles.ineligible}`}>
        {!has5 ? (
          labels.too_few_votes.details
        ) : (
          uniqueCreatorCount >= 5 ? (
            "Minimum 5 eligible vote requiremnt met!"
          ) : (
            <div>
              {labels.diversity_rule.details}
              <div>
                <b>{uniqueCreatorCount}/5</b> unique creators present
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
