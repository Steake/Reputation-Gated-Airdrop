<script lang="ts">
  import { ExternalLink } from "lucide-svelte";

  const attestationMethods = [
    {
      title: "Verify Personhood",
      description:
        "Prove you are a unique human using services like Worldcoin, Proof of Humanity, or BrightID. This is a foundational step for building trust.",
      link: "#",
    },
    {
      title: "Link Developer Accounts",
      description:
        "Connect your GitHub or GitLab accounts to receive attestations for your code contributions, repository stars, and open-source activity.",
      link: "#",
    },
    {
      title: "Get Vouched For",
      description:
        "Request a vouch from an existing high-reputation member of the community. A vouch acts as a direct endorsement of your standing.",
      link: "#",
    },
    {
      title: "Participate in Governance",
      description:
        "Engage with DAO governance by voting on proposals on platforms like Snapshot. Active participation signals your commitment to the ecosystem.",
      link: "#",
    },
    {
      title: "Collect On-chain Credentials",
      description:
        "Mint credentials from platforms like Galxe or GitPOAP for participating in events, hackathons, and campaigns.",
      link: "#",
    },
  ];
</script>

<div class="max-w-3xl mx-auto">
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold tracking-tight text-gray-900">
      Earn Reputation
    </h1>
    <p class="mt-4 text-lg text-gray-600">
      Your reputation score is a composite of various on-chain and off-chain
      activities. Increase your score by collecting attestations that prove your
      contributions and identity.
    </p>
  </div>

  <div class="space-y-6">
    {#each attestationMethods as method}
      <div
        class="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
      >
        <h2 class="text-xl font-semibold text-gray-800">{method.title}</h2>
        <p class="mt-2 text-gray-600">{method.description}</p>
        <div class="mt-4">
          <a
            href={method.link}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center text-sm font-semibold text-brand-primary hover:text-brand-dark"
          >
            Get Started <ExternalLink class="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    {/each}
  </div>
</div>
