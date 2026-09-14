package com.webhunt.app

import android.app.Application
import com.webhunt.app.data.api.NetworkModule
import com.webhunt.app.data.repository.AuthRepository
import com.webhunt.app.data.repository.PipelineRepository
import com.webhunt.app.data.repository.ProfileRepository
import com.webhunt.app.data.repository.SearchRepository
import com.webhunt.app.data.repository.SubscriptionRepository
import com.webhunt.app.data.repository.TaxonomyRepository
import com.webhunt.app.data.storage.SessionManager

class WebHuntApplication : Application() {

    lateinit var sessionManager: SessionManager
        private set

    lateinit var networkModule: NetworkModule
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var searchRepository: SearchRepository
        private set

    lateinit var pipelineRepository: PipelineRepository
        private set

    lateinit var taxonomyRepository: TaxonomyRepository
        private set

    lateinit var profileRepository: ProfileRepository
        private set

    lateinit var subscriptionRepository: SubscriptionRepository
        private set

    lateinit var searchHistoryManager: com.webhunt.app.data.storage.SearchHistoryManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this

        sessionManager = SessionManager(this)
        searchHistoryManager = com.webhunt.app.data.storage.SearchHistoryManager(this)
        networkModule = NetworkModule(this, sessionManager)

        searchRepository = SearchRepository(networkModule.apiService)
        pipelineRepository = PipelineRepository(networkModule.apiService)
        taxonomyRepository = TaxonomyRepository(this, networkModule.apiService)
        profileRepository = ProfileRepository(networkModule.apiService)
        subscriptionRepository = SubscriptionRepository(networkModule.apiService)

        authRepository = AuthRepository(
            networkModule.apiService,
            sessionManager,
            onClearData = {
                pipelineRepository.clear()
                profileRepository.clear()
                subscriptionRepository.clear()
            }
        )
    }

    companion object {
        lateinit var instance: WebHuntApplication
            private set
    }
}
