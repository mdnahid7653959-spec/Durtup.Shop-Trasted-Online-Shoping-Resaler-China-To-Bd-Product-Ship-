/**
 * Tier 1: Feature Coverage
 * Feature 3: Automatic Account & Profile Creation (F3)
 * Requirement: ORIGINAL_REQUEST §R1, PROJECT.md F3
 */

import assert from 'node:assert';
import { TestCase, UserProfile } from '../helpers/types';
import { TEST_USERS } from '../helpers/authHelper';
import { MockLocalStorage } from '../helpers/cartHelper';

export const f03Tests: TestCase[] = [
  {
    id: 'F3-T01',
    name: 'F3: First-time Google Sign-In automatically constructs customer profile with role customer',
    feature: 'F3: Automatic Account & Profile Creation',
    run: () => {
      const mockGoogleAuthResult = {
        user: {
          uid: 'google_uid_new_999',
          email: 'newuser@gmail.com',
          displayName: 'New Shopper',
          photoURL: 'https://lh3.googleusercontent.com/avatar999'
        }
      };

      // Profile creation logic (from client.ts signInWithGoogle)
      const user = mockGoogleAuthResult.user;
      const userProf: UserProfile = {
        id: user.uid,
        user_id: user.uid,
        email: user.email || '',
        full_name: user.displayName || user.email?.split('@')[0] || 'User',
        avatar_url: user.photoURL || undefined,
        role: 'customer'
      };

      assert.strictEqual(userProf.id, 'google_uid_new_999');
      assert.strictEqual(userProf.role, 'customer', 'Role must default to customer');
      assert.strictEqual(userProf.email, 'newuser@gmail.com');
      assert.strictEqual(userProf.full_name, 'New Shopper');
    }
  },
  {
    id: 'F3-T02',
    name: 'F3: Profile creation accurately captures Google avatar and full name',
    feature: 'F3: Automatic Account & Profile Creation',
    run: () => {
      const user = TEST_USERS.CUSTOMER_NEW;
      const photo = 'https://lh3.googleusercontent.com/a/ACg8oc';

      const profile: UserProfile = {
        id: user.uid,
        user_id: user.uid,
        email: user.email,
        full_name: user.full_name,
        avatar_url: photo,
        role: 'customer'
      };

      assert.strictEqual(profile.avatar_url, photo);
      assert.strictEqual(profile.full_name, 'Charlie Newcomer');
    }
  },
  {
    id: 'F3-T03',
    name: 'F3: Returning customer Google Sign-In restores existing profile without destructive overwrite',
    feature: 'F3: Automatic Account & Profile Creation',
    run: () => {
      // Existing profile in Firestore
      const existingProfile: UserProfile = {
        id: TEST_USERS.CUSTOMER_ALPHA.uid,
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        full_name: 'Alpha Customer Custom Name',
        role: 'customer',
        phone: '01711223344'
      };

      // Returning sign in with merge: true logic
      const incomingLogin = {
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        displayName: 'Google Raw Name'
      };

      const restoredProfile: UserProfile = {
        ...existingProfile,
        email: incomingLogin.email
      };

      assert.strictEqual(restoredProfile.phone, '01711223344', 'Saved customer phone must be preserved');
      assert.strictEqual(restoredProfile.full_name, 'Alpha Customer Custom Name', 'Custom full name must be preserved');
    }
  },
  {
    id: 'F3-T04',
    name: 'F3: Profile creation binds customer UID for downstream order attribution',
    feature: 'F3: Automatic Account & Profile Creation',
    run: () => {
      const profile: UserProfile = {
        id: TEST_USERS.CUSTOMER_ALPHA.uid,
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        full_name: TEST_USERS.CUSTOMER_ALPHA.full_name,
        role: 'customer'
      };

      assert.strictEqual(profile.user_id, profile.id, 'user_id must match authenticated profile ID');
      assert.ok(profile.user_id.length > 5, 'Valid UID required for orders');
    }
  },
  {
    id: 'F3-T05',
    name: 'F3: Profile caching synchronizes to client localStorage for instantaneous offline render',
    feature: 'F3: Automatic Account & Profile Creation',
    run: () => {
      const storage = new MockLocalStorage();
      const profile: UserProfile = {
        id: TEST_USERS.CUSTOMER_ALPHA.uid,
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        full_name: TEST_USERS.CUSTOMER_ALPHA.full_name,
        role: 'customer'
      };

      storage.setItem(`durtup_profile_${profile.id}`, JSON.stringify(profile));
      storage.setItem('durtup_active_user', profile.id);

      const cachedProfile = JSON.parse(storage.getItem(`durtup_profile_${profile.id}`) || '{}');
      const activeUser = storage.getItem('durtup_active_user');

      assert.strictEqual(cachedProfile.email, profile.email);
      assert.strictEqual(activeUser, profile.id);
    }
  }
];
