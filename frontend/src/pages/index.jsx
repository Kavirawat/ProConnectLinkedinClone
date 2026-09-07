import Image from "next/image";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import UserLayout from "../layout/UserLayout/index";

export default function Home() {
  const router = useRouter();
  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContainer_left}>
            <p>Connect with friends without Exaggeration</p>
            <p>A true social media plateform, with stories no blufs!</p>

            <div
              onClick={() => {
                router.push("/login");
              }}
              className={styles.buttonJoin}
            >
              <p>Join Now</p>
            </div>
          </div>
          <div className={styles.mainContainer_right}>
            <img src="/images/linkedin.png" alt="" />
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
