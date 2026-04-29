export async function searchAnime(query){
    try{
        const url = new URL("https://api.jikan.moe/v4/anime")

        url.searchParams.append("q", query)
        url.searchParams.append("limit", "5")

        const response = await fetch(url)

        if(!response.ok){
            throw new Error(`Jikan API error: ${response.status}`)
        }

        const data = await response.json()

        return data.data.map((anime) => ({
            id: anime.mal_id,
            title: anime.title,
            titleEnglish: anime.title_english,
            type: anime.type,
            episodes: anime.episodes,
            score: anime.score,
            status: anime.status,
            year: anime.year,
            synopsis: anime.synopsis,
            image: anime.images?.jpg?.image_url,
            url: anime.url
        }))
    }
    catch(err){
        console.error("Jikan API error: ", error.message)
        throw new Error("Failed to fetch anime data from Jikan API")
    }
}