import React from 'react'
import '../Styles/Suggestions.css'
import { SuggestionLine } from '../Components/SuggestionLine'
import { useTranslation } from 'react-i18next'

function Suggestions() {

    const {t} = useTranslation()

    return (
        <div className="suggestions-column">
            <div className="top-suggestion-line">
                <h5>{t('suggestions.suggestionsForYou')}</h5>
                <span>{t('suggestions.seeAll')}</span>
            </div>
            <div className="suggested-accounts">
                <SuggestionLine />
                <SuggestionLine />
                <SuggestionLine />
            </div>
        </div>
    )
}

export default Suggestions
