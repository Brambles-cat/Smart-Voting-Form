export default function ConstructionZone() {
  const r = Math.random()

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "30px", fontSize: "1.5rem", fontWeight: 500 }}>
        Under Construction
        <a href="https://derpibooru.org/images/1484999">
          <img src="https://derpicdn.net/img/2017/7/13/1484999/large.png" style={{ width: "350px" }} referrerPolicy="no-referrer"/>
        </a>
        {r < 0.1 &&
          <a href={`https://derpibooru.org/images/${r < 0.025 ? 3211943 : 3211945}`} style={{ position: "absolute", bottom: "2vh", right: "2vw" }}>
            <img src={`https://derpicdn.net/img/view/${r < 0.025 ? "2023/10/3/3211943": "2023/10/3/3211945"}/.gif`} style={{ width: "10vh" }} referrerPolicy="no-referrer"/>
          </a>
        }
      </div>
    </div>
  )
}
