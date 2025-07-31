import { getAllData } from "@/lib/database";
import { NextRequest } from "next/server"
import { utils, write } from "xlsx"

// Endpoint for downloading all data from all tables as an xlsx file
export async function GET(req: NextRequest) {
    const uid = req.cookies.get("uid")?.value

    if (!uid || uid !== process.env.OPERATOR)
        return new Response(null, { status: 403 })

    const data = await getAllData()
    const workbook = utils.book_new()

    for (const [ name, table ] of Object.entries(data)) {
        const worksheet = utils.json_to_sheet(table)
        utils.book_append_sheet(workbook, worksheet, name)
    }

    const file = write(workbook, {type: "array", bookType: "xlsx"})

    return new Response(file, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=\"Smol's Form Data.xlsx\"",
        }
    })
}
