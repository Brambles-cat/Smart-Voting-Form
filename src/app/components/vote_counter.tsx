import Image from "next/image";
import styles from "../page.module.css";

interface Props {
  eligibleCount: number;
  uniqueCreatorCount: number;
}

export default function VoteCounter({ eligibleCount, uniqueCreatorCount }: Props) {
  const has5 = eligibleCount >= 5;

  return (
    <div className={styles.eligible_count}>
      <b>{eligibleCount}/{has5 ? 10 : 5}</b>{" "}
      {has5 && <Image src={uniqueCreatorCount >= 5 ? "checkmark.svg" : "x.svg"} alt="" width={20} height={20}/>}

      <div className={`${styles.eligible_count_note} ${has5 && (uniqueCreatorCount >= 5 && styles.good) || styles.ineligible}`}>
        {has5 ? (
          uniqueCreatorCount >= 5 ? (
            "Minimum 5 eligible vote requiremnt met!"
          ) : (
            <div>
              5a. You must have at least five eligible votes from five different creators
              <div>
                <b>{uniqueCreatorCount}/5</b> unique creators present
              </div>
            </div>
          )
        ) : (
          "1a. Vote for a minimum of 5 eligible videos and maximum of 10"
        )}
      </div>
    </div>
  );
}
