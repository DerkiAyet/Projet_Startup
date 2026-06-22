import React from 'react'
import '../Styles/Suggestions.css'
import { SuggestionLine } from '../Components/SuggestionLine'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import axios from "axios"
import { useEffect } from 'react'

function Suggestions() {

    const { t } = useTranslation()

    const [suggestions, setSuggestions] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/posts/suggestions`)
                setSuggestions(res.data)
                console.log(res.data)
            } catch (error) {
                console.log(error.message)
            }
        }
        fetchData();
    }, [])

    const [query, setQuery] = useState("")
    const [resultSearch, setResultSearch] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    const handleSearch = async (e) => {
        try {
            if (!query.trim()) return alert('enter a valid name')
            const params = new URLSearchParams();
            params.set("q", query.toLocaleLowerCase())

            const request = await axios.get(`${process.env.REACT_APP_API_URL_GATEWAY}/users/infos/search?${params.toString()}`)
            setResultSearch(request.data.users)
            setIsSearching(true)

        } catch (error) {
            console.error('error while searching for users', error)
        }

    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="suggestions-column">
            <div className="search-wrap">
                <i className="ri-search-line search-icon" />
                <input
                    type="text"
                    placeholder={t("posts.search")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKey}
                    style={{ color: "#000" }}
                />
            </div>
            <div className="top-suggestion-line">
                <h5>{t('suggestions.suggestionsForYou')}</h5>
                <span>{t('suggestions.seeAll')}</span>
            </div>
            <div className="suggested-accounts">
                {
                    isSearching ? (
                        resultSearch.map((u) => (
                            <SuggestionLine
                                userImg={u.uerImg}
                                userName={u.userName}
                                familyName={u.familyName}
                                givenName={u.givenName}
                            />
                        ))) : (suggestions.map((s) => (
                            <SuggestionLine
                                userImg={s.userImg}
                                userName={s.userName}
                                familyName={s.familyName}
                                givenName={s.givenName}
                            />
                        )))
                }
            </div>
        </div>
    )
}

export default Suggestions
