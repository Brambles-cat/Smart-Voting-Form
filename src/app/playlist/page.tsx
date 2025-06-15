import styles from "./page.module.css"

export default function playlist() {
    const editor = true
    const videos = ["title"]

    return (
        <div className={styles.page}>
            {editor &&
                <div className={styles.editor_field}>
                    <div className={styles.display}></div>
                    <div className={styles.settings_field}>
                        <button className={styles.setting}>s</button>
                        <button className={styles.setting}>s2</button>
                    </div>
                </div>
            }
            <div className={styles.entry}>
                <button className={styles.add_btn}></button>
                {videos.map((v, i) =>
                    <div key={i} className={styles.video_item}>{v}</div>)
                }
            </div>
        </div>
    )
}
