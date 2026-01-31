const { supabaseAdmin } = require('../config/supabase');

/**
 * AuthService handles all authentication operations
 * Including organization auto-creation on signup
 */
class AuthService {

    /**
     * Sign up a new user and auto-create organization
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} organizationName - Name of organization to create
     * @returns {Object} User data, organization data, and session
     */
    async signup(email, password, organizationName) {
        try {
            // Step 1: Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true // Auto-confirm email for MVP
            });

            if (authError) {
                throw new Error(`Auth error: ${authError.message}`);
            }

            const userId = authData.user.id;

            // Step 2: Create organization
            const { data: orgData, error: orgError } = await supabaseAdmin
                .from('organizations')
                .insert({
                    name: organizationName
                })
                .select()
                .single();

            if (orgError) {
                // Rollback: delete the user if org creation fails
                await supabaseAdmin.auth.admin.deleteUser(userId);
                throw new Error(`Organization creation error: ${orgError.message}`);
            }

            // Step 3: Create user profile with admin role
            const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: userId,
                    organization_id: orgData.id,
                    email: email,
                    role: 'admin' // First user is always admin
                })
                .select()
                .single();

            if (userError) {
                // Rollback: delete organization and user
                await supabaseAdmin.from('organizations').delete().eq('id', orgData.id);
                await supabaseAdmin.auth.admin.deleteUser(userId);
                throw new Error(`User profile creation error: ${userError.message}`);
            }

            // Step 4: Generate session token for the user
            const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email
            });

            if (sessionError) {
                console.error('Session generation warning:', sessionError.message);
            }

            return {
                success: true,
                user: {
                    id: userData.id,
                    email: userData.email,
                    role: userData.role,
                    organizationId: userData.organization_id
                },
                organization: {
                    id: orgData.id,
                    name: orgData.name
                },
                message: 'User created successfully. Please use the login endpoint to get a session.'
            };

        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    /**
     * Log in an existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} User data with session token
     */
    async login(email, password) {
        try {
            // Step 1: Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                throw new Error(`Login error: ${authError.message}`);
            }

            const userId = authData.user.id;

            // Step 2: Get user profile with organization details
            const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select(`
          id,
          email,
          role,
          organization_id,
          organizations:organization_id (
            id,
            name
          )
        `)
                .eq('id', userId)
                .single();

            if (userError) {
                throw new Error(`User profile error: ${userError.message}`);
            }

            return {
                success: true,
                user: {
                    id: userData.id,
                    email: userData.email,
                    role: userData.role,
                    organizationId: userData.organization_id
                },
                organization: userData.organizations,
                session: {
                    accessToken: authData.session.access_token,
                    refreshToken: authData.session.refresh_token,
                    expiresAt: authData.session.expires_at
                }
            };

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Verify a JWT token and return user data
     * @param {string} token - JWT access token
     * @returns {Object} User data
     */
    async verifyToken(token) {
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

            if (error) {
                throw new Error(`Token verification error: ${error.message}`);
            }

            // Get user profile
            let { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select(`
                    id,
                    email,
                    role,
                    organization_id,
                    organizations:organization_id (
                        id,
                        name
                    )
                `)
                .eq('id', user.id)
                .maybeSingle();

            // JIT Provisioning: If user exists in Auth but not in our 'users' table (common with social login)
            if (!userData && !userError) {
                console.log(`JIT Provisioning new social user: ${user.email}`);

                // 1. Create a default personal organization
                const { data: orgData, error: orgErr } = await supabaseAdmin
                    .from('organizations')
                    .insert({ name: `${user.email.split('@')[0]}'s Org` })
                    .select()
                    .single();

                if (orgErr) throw orgErr;

                // 2. Create the user profile
                const { data: newProfile, error: profileErr } = await supabaseAdmin
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        organization_id: orgData.id,
                        role: 'admin'
                    })
                    .select(`
                        id,
                        email,
                        role,
                        organization_id,
                        organizations:organization_id (
                            id,
                            name
                        )
                    `)
                    .single();

                if (profileErr) throw profileErr;
                userData = newProfile;
            } else if (userError) {
                throw new Error(`User profile error: ${userError.message}`);
            }

            return {
                success: true,
                user: {
                    id: userData.id,
                    email: userData.email,
                    role: userData.role,
                    organizationId: userData.organization_id,
                    organization: userData.organizations
                }
            };

        } catch (error) {
            console.error('Token verification error:', error);
            throw error;
        }
    }
}

module.exports = new AuthService();
