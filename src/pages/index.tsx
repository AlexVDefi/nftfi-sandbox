import LeaderBoardTable from '@/components/LeaderBoardTable';
import { Meta } from '@/layouts/Meta';
import { Main } from '@/templates/Main';

const Index = () => (
  <Main
    meta={<Meta title="Nftfi Sandbox Index" description="The index page." />}
  >
    <div className="flex min-h-screen flex-col items-center justify-center gap-10">
      <h1 className="h-auto w-auto text-center text-3xl text-white">
        Unofficial NFTFI Lenders Leaderboard
      </h1>
      <LeaderBoardTable />
    </div>
  </Main>
);

export default Index;
