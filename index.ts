import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { buildNetwork } from './network/builder';
import { RawFollower } from './network/types';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'https://api-v2.lens.dev/',
  cache: new InMemoryCache()
});

// GraphQL Queries
const PROFILE_METADATA = gql`
  query Profile($request: ProfileRequest!) {
    profile(request: $request) {
      metadata {
        picture {
          ... on ImageSet {
            optimized {
              uri
            }
          }
        }
      }
      id
      stats {
        followers
        following
        lensClassifierScore
      }
    }
  }
`;

const GET_FOLLOWER_DETAILS = gql`
  query Followers($request: FollowersRequest!) {
    followers(request: $request) {
      items {
        handle {
          fullHandle
          localName
        }
        id
        metadata {
          picture {
            ... on ImageSet {
              optimized {
                uri
            }
          }
        }
      }
      stats {
        followers
        following
        lensClassifierScore
      }
    }
  }
}
`;

// Helper Functions
async function getProfileMetadata(lensHandle: string) {
  const result = await client.query({
    query: PROFILE_METADATA,
    variables: { request: { forHandle: lensHandle } }
  });
  return {
    id: result.data.profile.id,
    picture: result.data.profile.metadata?.picture?.optimized?.uri,
    followersCount: result.data.profile.stats.followers,
    followingCount: result.data.profile.stats.following,
    lensScore: result.data.profile.stats.lensClassifierScore
    
  };
}

async function getFollowerDetails(profileId: string): Promise<RawFollower[]> {
  const result = await client.query({
    query: GET_FOLLOWER_DETAILS,
    variables: {
      request: {
        orderBy: "PROFILE_CLASSIFIER",
        of: profileId,
        limit: "Ten"
      }
    }
  });

  return result.data.followers.items.map((follower: any) => ({
    id: follower.id,
    handle: follower.handle.fullHandle,
    picture: follower.metadata?.picture?.optimized?.uri || "default_image.png",
    following: profileId,
    followersCount: follower.stats.followers,
    followingCount: follower.stats.following,
    lensScore: follower.stats.lensClassifierScore
  }));
}

// Main Execution
async function main() {
  try {
    const network = await buildNetwork(
      "lens/robinroy",
      getProfileMetadata,
      getFollowerDetails,
      200
    );

    console.log('Final Network:');
    console.log(`Nodes: ${network.nodes.length}`);
    console.log(`Links: ${network.links.length}`);
    
    // To save as JSON file:
    const fs = require('fs');
    fs.writeFileSync('network.json', JSON.stringify(network, null, 2));
  } catch (error) {
    console.error('Execution failed:', error);
  }
}

main();