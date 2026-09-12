package com.webhunt.app.data.api

import com.webhunt.app.data.model.AuthMeResponse
import com.webhunt.app.data.model.AuthResponse
import com.webhunt.app.data.model.GenericApiResponse
import com.webhunt.app.data.model.LoginRequest
import com.webhunt.app.data.model.ProfileResponse
import com.webhunt.app.data.model.ProviderStatusesResponse
import com.webhunt.app.data.model.RegisterRequest
import com.webhunt.app.data.model.SearchRequest
import com.webhunt.app.data.model.SearchResponse
import com.webhunt.app.data.model.SubscriptionResponse
import com.webhunt.app.data.model.TaxonomyResponse
import com.webhunt.app.data.model.UserProfileData
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface WebHuntApiService {

    // Authentication
    @POST("api/mobile/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/mobile/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @GET("api/mobile/auth/me")
    suspend fun getAuthMe(): Response<AuthMeResponse>

    @POST("api/mobile/auth/logout")
    suspend fun logout(): Response<GenericApiResponse>

    // Dual Radar Search
    @POST("api/mobile/search")
    suspend fun executeSearch(@Body request: SearchRequest): Response<SearchResponse>

    @GET("api/mobile/providers/status")
    suspend fun getProviderStatuses(): Response<ProviderStatusesResponse>

    // Lead Pipeline CRM
    @GET("api/mobile/pipeline/leads")
    suspend fun getPipelineLeads(): Response<JsonObject>

    @POST("api/mobile/pipeline/leads")
    suspend fun savePipelineLead(@Body payload: JsonObject): Response<JsonObject>

    @PUT("api/mobile/pipeline/leads/{id}")
    suspend fun updatePipelineLead(
        @Path("id") leadId: String,
        @Body payload: JsonObject
    ): Response<GenericApiResponse>

    @DELETE("api/mobile/pipeline/leads/{id}")
    suspend fun deletePipelineLead(@Path("id") leadId: String): Response<GenericApiResponse>

    // Taxonomy & Countries
    @GET("api/mobile/taxonomy")
    suspend fun getTaxonomy(): Response<TaxonomyResponse>

    // Profile & Pitch Settings
    @GET("api/mobile/profile")
    suspend fun getProfile(): Response<ProfileResponse>

    @PUT("api/mobile/profile")
    suspend fun updateProfile(@Body profile: UserProfileData): Response<ProfileResponse>

    // Subscription & Billing
    @GET("api/mobile/subscription")
    suspend fun getSubscription(): Response<SubscriptionResponse>
}
